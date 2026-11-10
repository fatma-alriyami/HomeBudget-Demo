using HomeBudget.API.Data;
using HomeBudget.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudget.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<FinancialSummaryDto>> GetSummary(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            if (!fromDate.HasValue || !toDate.HasValue)
            {
                return BadRequest(new
                {
                    message = "From date and to date are required."
                });
            }

            var startDate = fromDate.Value.Date;
            var endDate = toDate.Value.Date;

            var minimumDate = new DateTime(2000, 1, 1);
            var maximumDate = new DateTime(2100, 12, 31);

            if (startDate < minimumDate ||
                startDate > maximumDate ||
                endDate < minimumDate ||
                endDate > maximumDate)
            {
                return BadRequest(new
                {
                    message = "Dates must be between 2000 and 2100."
                });
            }

            if (startDate > endDate)
            {
                return BadRequest(new
                {
                    message = "From date must not be later than to date."
                });
            }

            var endExclusive = endDate.AddDays(1);

            var incomes = _context.Incomes
                .AsNoTracking()
                .Where(i =>
                    i.IncomeDate >= startDate &&
                    i.IncomeDate < endExclusive);

            var expenses = _context.Expenses
                .AsNoTracking()
                .Where(e =>
                    e.ExpenseDate >= startDate &&
                    e.ExpenseDate < endExclusive);

            var incomeSummary = await incomes
                .GroupBy(i => 1)
                .Select(g => new
                {
                    Total = g.Sum(i => i.Amount),
                    Count = g.Count()
                })
                .SingleOrDefaultAsync();

            var expenseSummary = await expenses
                .GroupBy(e => 1)
                .Select(g => new
                {
                    Total = g.Sum(e => e.Amount),
                    Count = g.Count()
                })
                .SingleOrDefaultAsync();

            var report = new FinancialSummaryDto
            {
                FromDate = startDate,
                ToDate = endDate,
                TotalIncome = incomeSummary?.Total ?? 0m,
                TotalExpenses = expenseSummary?.Total ?? 0m,
                IncomeCount = incomeSummary?.Count ?? 0,
                ExpenseCount = expenseSummary?.Count ?? 0
            };

            return Ok(report);
        }
    }
}